import { DatabaseCore } from './function/core.js';
import { dbConfig } from './function/config.js';
import { generateUUID } from './function/utils.js';
import { userService } from './user.service.js';

export interface Activity {
    id: string;
    userId: string;
    name: string;
    type: string;
    parcoursId: string;
    status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
    startTime?: number;
    endTime?: number;
    distance: number;
    currentDistance?: number;
    duration?: number;
    averageSpeed?: number;
    currentSpeed?: number;
    calories?: number;
    coordinates?: Array<[number, number]>;
    elevation?: number;
    heartRate?: number;
    date: string;
    weather?: {
        temperature?: number;
        condition?: string;
        humidity?: number;
    };
}

export class ActivityService extends DatabaseCore {
    private readonly CURRENT_ACTIVITY_KEY = 'current_activity';

    constructor() {
        super(dbConfig);
    }

    async createActivity(activityData: Partial<Activity>): Promise<Activity> {
        const user = await userService.getCurrentUser();
        if (!user || !user.id) {
            throw new Error('Utilisateur non connecté');
        }

        const activity: Activity = {
            id: generateUUID(),
            userId: user.id || '',
            name: activityData.name || 'Nouvelle activité',
            type: activityData.type || 'unknown',
            parcoursId: activityData.parcoursId || '',
            status: 'planned',
            distance: activityData.distance || 0,
            currentDistance: 0,
            date: new Date().toISOString(),
            coordinates: [],
            ...activityData
        };

        await this.executeTransaction<void>('activities', 'readwrite', (store) => {
            return store.add(activity);
        });

        localStorage.setItem(this.CURRENT_ACTIVITY_KEY, JSON.stringify(activity));

        return activity;
    }

    async startActivity(activityId: string): Promise<void> {
        const activity = await this.getActivity(activityId);
        if (!activity) throw new Error('Activité non trouvée');

        activity.status = 'in_progress';
        activity.startTime = Date.now();
        activity.coordinates = [];

        await this.updateActivity(activity);
    }

    async updateActivityProgress(activityId: string, data: {
        currentPosition: [number, number],
        currentSpeed?: number,
        distance?: number,
        calories?: number,
        heartRate?: number
    }): Promise<void> {
        const activity = await this.getActivity(activityId);
        if (!activity || activity.status !== 'in_progress') {
            throw new Error('Activité non trouvée ou non démarrée');
        }

        activity.coordinates?.push(data.currentPosition);
        activity.currentSpeed = data.currentSpeed;
        activity.currentDistance = data.distance;
        activity.calories = data.calories;
        activity.heartRate = data.heartRate;

        await this.updateActivity(activity);
    }

    async completeActivity(activityId: string): Promise<void> {
        const activity = await this.getActivity(activityId);
        if (!activity) throw new Error('Activité non trouvée');

        activity.status = 'completed';
        activity.endTime = Date.now();
        activity.duration = activity.endTime - (activity.startTime || 0);

        if (activity.currentDistance) {
            activity.averageSpeed = (activity.currentDistance / activity.duration) * 3600; // km/h
        }

        await this.updateActivity(activity);
    }

    private async getCurrentUserId(): Promise<string> {
        const user = await userService.isUserLoggedIn();
        if (!user) throw new Error('Utilisateur non connecté');
        return user.toString();
    }

    async getActivity(id: string): Promise<Activity | null> {
        return this.executeTransaction<Activity | null>('activities', 'readonly', (store) => {
            return store.get(id);
        });
    }

    private async updateActivity(activity: Activity): Promise<void> {
        await this.executeTransaction<void>('activities', 'readwrite', (store) => {
            return store.put(activity);
        });
    }

    async getUserActivities(userId: string): Promise<Activity[]> {
        return this.executeTransaction<Activity[]>('activities', 'readonly', (store) => {
            const index = store.index('userId');
            return index.getAll(userId);
        });
    }

    getCurrentActivity(): Activity | null {
        const stored = localStorage.getItem(this.CURRENT_ACTIVITY_KEY);
        return stored ? JSON.parse(stored) : null;
    }

    clearCurrentActivity(): void {
        localStorage.removeItem(this.CURRENT_ACTIVITY_KEY);
    }
}

export const activityService = new ActivityService(); 