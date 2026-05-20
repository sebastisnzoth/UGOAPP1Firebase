import { cachedAccessToken } from '../firebase';

const BASE_URL = 'https://www.googleapis.com/calendar/v3';

export const getGoogleCalendarEvents = async () => {
  if (!cachedAccessToken) {
    throw new Error('User not authenticated with Google');
  }

  const timeMin = new Date().toISOString();
  
  const response = await fetch(`${BASE_URL}/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&maxResults=10&singleEvents=true&orderBy=startTime`, {
    headers: {
      Authorization: `Bearer ${cachedAccessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch calendar events');
  }

  return response.json();
};

export const createGoogleCalendarEvent = async (summary: string, description: string, startTime: string, endTime: string) => {
  if (!cachedAccessToken) {
    throw new Error('User not authenticated with Google');
  }

  const event = {
    summary,
    description,
    start: {
      dateTime: startTime,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: endTime,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  };

  const response = await fetch(`${BASE_URL}/calendars/primary/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cachedAccessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    throw new Error('Failed to create calendar event');
  }

  return response.json();
};
