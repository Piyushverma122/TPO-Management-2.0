import apiClient from './axios';

export interface CalendarQueryParams {
  start_date?: string;
  end_date?: string;
  event_type?: string;
}

export const getEvents = async (params?: CalendarQueryParams) => {
  const response = await apiClient.get('/calendar/events', { params });
  return response.data;
};

export const getEventById = async (id: string) => {
  const response = await apiClient.get(`/calendar/events/${id}`);
  return response.data;
};

export const createEvent = async (data: any) => {
  const response = await apiClient.post('/calendar/events', data);
  return response.data;
};

export const updateEvent = async (id: string, data: any) => {
  const response = await apiClient.put(`/calendar/events/${id}`, data);
  return response.data;
};

export const deleteEvent = async (id: string) => {
  const response = await apiClient.delete(`/calendar/events/${id}`);
  return response.data;
};

export const getUpcomingEvents = async () => {
  const response = await apiClient.get('/calendar/upcoming');
  return response.data;
};

export const getTodayEvents = async () => {
  const response = await apiClient.get('/calendar/today');
  return response.data;
};

export const getWeekEvents = async () => {
  const response = await apiClient.get('/calendar/week');
  return response.data;
};
