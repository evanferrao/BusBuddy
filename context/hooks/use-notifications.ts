/**
 * Notifications Hook
 * 
 * Manages notifications, wait requests, and absences.
 */

import * as FirestoreService from '@/services/firestore';
import * as MockData from '@/services/mock-data';
import * as TripService from '@/services/trip-service';
import { NotificationType, PassengerNotification, RouteStop, Trip, UserRole } from '@/types';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface UseNotificationsParams {
  userId: string | null;
  userRole: UserRole;
  activeTrip: Trip | null;
  preferredStopId: string | null;
  routeStops: RouteStop[];
}

interface UseNotificationsReturn {
  notifications: PassengerNotification[];
  unreadCount: number;
  hasMarkedAbsence: boolean;
  hasSentWaitRequest: boolean;
  setHasMarkedAbsence: (value: boolean) => void;
  setHasSentWaitRequest: (value: boolean) => void;
  resetNotificationStates: () => void;
  sendNotification: (type: NotificationType, message?: string) => Promise<void>;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
}

export function useNotifications({
  userId,
  userRole,
  activeTrip,
  preferredStopId,
  routeStops,
}: UseNotificationsParams): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<PassengerNotification[]>([]);
  const [hasMarkedAbsence, setHasMarkedAbsence] = useState(false);
  const [hasSentWaitRequest, setHasSentWaitRequest] = useState(false);

  // Subscribe to wait requests and absences for driver
  useEffect(() => {
    if (userRole !== 'driver' || !activeTrip) return;

    setNotifications([]);
    MockData.clearNotifications();

    const unsubscribeWait = TripService.subscribeToWaitRequests(
      activeTrip.tripId,
      async (waitRequests) => {
        const waitNotifications: PassengerNotification[] = await Promise.all(
          waitRequests.map(async (req) => {
            const passenger = await FirestoreService.getUserData(req.passengerId);
            const stop = routeStops.find(s => s.stopId === req.stopId);
            return {
              id: `wait-${req.passengerId}`,
              passengerId: req.passengerId,
              passengerName: passenger?.name || 'Unknown',
              stopId: req.stopId,
              stopName: stop?.name || 'Unknown Stop',
              type: 'wait' as NotificationType,
              timestamp: req.requestedAt,
              isRead: false,
            };
          })
        );
        
        setNotifications(prev => {
          const absenceNotifs = prev.filter(n => n.type === 'skip');
          return [...waitNotifications, ...absenceNotifs];
        });
      }
    );

    const unsubscribeAbsence = TripService.subscribeToAbsences(
      activeTrip.tripId,
      async (absences) => {
        const absenceNotifications: PassengerNotification[] = await Promise.all(
          absences.map(async (absence) => {
            const passenger = await FirestoreService.getUserData(absence.passengerId);
            const stop = routeStops.find(s => s.stopId === absence.stopId);
            return {
              id: `absence-${absence.passengerId}`,
              passengerId: absence.passengerId,
              passengerName: passenger?.name || 'Unknown',
              stopId: absence.stopId,
              stopName: stop?.name || 'Unknown Stop',
              type: 'skip' as NotificationType,
              timestamp: absence.markedAt,
              isRead: false,
            };
          })
        );
        
        setNotifications(prev => {
          const waitNotifs = prev.filter(n => n.type === 'wait');
          return [...waitNotifs, ...absenceNotifications];
        });
      }
    );

    return () => {
      unsubscribeWait();
      unsubscribeAbsence();
    };
  }, [userRole, activeTrip, routeStops]);

  // Subscribe to own notifications for passengers
  useEffect(() => {
    if (userRole !== 'passenger' || !activeTrip || !userId) return;

    setNotifications([]);

    const unsubscribeWait = TripService.subscribeToWaitRequests(
      activeTrip.tripId,
      async (waitRequests) => {
        const myWaitRequests = waitRequests.filter(req => req.passengerId === userId);
        
        const waitNotifications: PassengerNotification[] = myWaitRequests.map(req => {
          const stop = routeStops.find(s => s.stopId === req.stopId);
          return {
            id: `wait-${req.passengerId}-${req.requestedAt}`,
            passengerId: req.passengerId,
            passengerName: 'You',
            stopId: req.stopId,
            stopName: stop?.name || 'Unknown Stop',
            type: 'wait' as NotificationType,
            timestamp: req.requestedAt,
            isRead: true,
          };
        });
        
        setNotifications(prev => {
          const absenceNotifs = prev.filter(n => n.type === 'skip');
          return [...waitNotifications, ...absenceNotifs];
        });
      }
    );

    const unsubscribeAbsence = TripService.subscribeToAbsences(
      activeTrip.tripId,
      async (absences) => {
        const myAbsences = absences.filter(absence => absence.passengerId === userId);
        
        const absenceNotifications: PassengerNotification[] = myAbsences.map(absence => {
          const stop = routeStops.find(s => s.stopId === absence.stopId);
          return {
            id: `absence-${absence.passengerId}-${absence.markedAt}`,
            passengerId: absence.passengerId,
            passengerName: 'You',
            stopId: absence.stopId,
            stopName: stop?.name || 'Unknown Stop',
            type: 'skip' as NotificationType,
            timestamp: absence.markedAt,
            isRead: true,
          };
        });
        
        setNotifications(prev => {
          const waitNotifs = prev.filter(n => n.type === 'wait');
          return [...waitNotifs, ...absenceNotifications];
        });
      }
    );

    return () => {
      unsubscribeWait();
      unsubscribeAbsence();
    };
  }, [userRole, activeTrip, userId, routeStops]);

  const unreadCount = useMemo(() => 
    notifications.filter(n => !n.isRead).length, 
    [notifications]
  );

  const resetNotificationStates = useCallback(() => {
    setHasSentWaitRequest(false);
    setHasMarkedAbsence(false);
    setNotifications([]);
    MockData.clearNotifications();
  }, []);

  const sendNotification = useCallback(async (
    type: NotificationType,
    _message?: string
  ) => {
    if (!userId || !activeTrip || !preferredStopId) {
      console.log('Cannot send notification: missing userId, activeTrip, or preferredStopId');
      return;
    }
    
    try {
      if (type === 'wait') {
        if (hasMarkedAbsence) {
          console.log('Cannot send wait request: already marked absent');
          return;
        }
        await TripService.sendWaitRequest(activeTrip.tripId, userId, preferredStopId);
        setHasSentWaitRequest(true);
        console.log('Wait request sent to Firestore');
      } else if (type === 'skip') {
        await TripService.markAbsence(activeTrip.tripId, userId, preferredStopId);
        setHasMarkedAbsence(true);
        await TripService.removeWaitRequest(activeTrip.tripId, userId);
        setHasSentWaitRequest(false);
        console.log('Absence marked in Firestore, wait request removed');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }, [userId, activeTrip, preferredStopId, hasMarkedAbsence]);

  const markNotificationRead = useCallback((id: string) => {
    MockData.markNotificationRead(id);
    setNotifications(MockData.getNotifications());
  }, []);

  const clearAllNotifications = useCallback(() => {
    MockData.clearNotifications();
    setNotifications([]);
  }, []);

  return {
    notifications,
    unreadCount,
    hasMarkedAbsence,
    hasSentWaitRequest,
    setHasMarkedAbsence,
    setHasSentWaitRequest,
    resetNotificationStates,
    sendNotification,
    markNotificationRead,
    clearAllNotifications,
  };
}
