// Google Classroom API helper using Google Identity Services (GSI) TokenClient
import { ClassroomCourse, DeadlineItem } from '../types';

declare global {
  interface Window {
    google?: any;
  }
}

const SCOPES = [
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.me.readonly'
].join(' ');

export class GoogleClassroomService {
  private static tokenClient: any = null;
  private static accessToken: string | null = null;
  private static tokenExpiresAt: number = 0;

  public static isConnected(): boolean {
    return !!this.accessToken && Date.now() < this.tokenExpiresAt;
  }

  public static getStoredToken(): string | null {
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }
    const saved = localStorage.getItem('g_classroom_token');
    const expires = localStorage.getItem('g_classroom_expires');
    if (saved && expires && Date.now() < parseInt(expires, 10)) {
      this.accessToken = saved;
      this.tokenExpiresAt = parseInt(expires, 10);
      return saved;
    }
    return null;
  }

  public static initClient(clientId: string, callback: (tokenResponse: any) => void) {
    if (window.google?.accounts?.oauth2) {
      this.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: (resp: any) => {
          if (resp.access_token) {
            this.accessToken = resp.access_token;
            const expiresIn = (resp.expires_in || 3599) * 1000;
            this.tokenExpiresAt = Date.now() + expiresIn;
            localStorage.setItem('g_classroom_token', resp.access_token);
            localStorage.setItem('g_classroom_expires', this.tokenExpiresAt.toString());
          }
          callback(resp);
        },
      });
    }
  }

  public static requestAccessToken(prompt: string = ''): Promise<string> {
    return new Promise((resolve, reject) => {
      const existingToken = this.getStoredToken();
      if (existingToken) {
        return resolve(existingToken);
      }

      if (!window.google?.accounts?.oauth2) {
        return reject(new Error('Google Identity Services script not yet loaded. Check internet connection.'));
      }

      // Re-request using tokenClient
      if (this.tokenClient) {
        this.tokenClient.requestAccessToken({ prompt });
        // The callback registered during initClient handles storage
        const checkInterval = setInterval(() => {
          if (this.accessToken) {
            clearInterval(checkInterval);
            resolve(this.accessToken);
          }
        }, 300);

        setTimeout(() => {
          clearInterval(checkInterval);
          if (!this.accessToken) {
            reject(new Error('OAuth authorization timed out or was closed by user.'));
          }
        }, 45000);
      } else {
        reject(new Error('Classroom client not initialized.'));
      }
    });
  }

  public static disconnect() {
    this.accessToken = null;
    this.tokenExpiresAt = 0;
    localStorage.removeItem('g_classroom_token');
    localStorage.removeItem('g_classroom_expires');
  }

  // Fetch student courses
  public static async fetchCourses(): Promise<ClassroomCourse[]> {
    const token = this.getStoredToken();
    if (!token) throw new Error('Not connected to Google Classroom');

    const res = await fetch('https://classroom.googleapis.com/v1/courses?studentId=me&courseStates=ACTIVE', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      if (res.status === 401) {
        this.disconnect();
        throw new Error('Google Classroom session expired. Please sign in again.');
      }
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to fetch Classroom courses');
    }

    const data = await res.json();
    return (data.courses || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      section: c.section,
      alternateLink: c.alternateLink,
    }));
  }

  // Fetch course work / assignments for a specific course
  public static async fetchCourseWork(courseId: string, courseName: string): Promise<DeadlineItem[]> {
    const token = this.getStoredToken();
    if (!token) throw new Error('Not connected to Google Classroom');

    const res = await fetch(`https://classroom.googleapis.com/v1/courses/${courseId}/courseWork`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    const items: DeadlineItem[] = [];

    (data.courseWork || []).forEach((cw: any) => {
      let dueDateStr = new Date(Date.now() + 86400000 * 3).toISOString();
      let dueTimeStr = '23:59';

      if (cw.dueDate) {
        const year = cw.dueDate.year || new Date().getFullYear();
        const month = String(cw.dueDate.month || 1).padStart(2, '0');
        const day = String(cw.dueDate.day || 1).padStart(2, '0');
        dueDateStr = `${year}-${month}-${day}T23:59:59.000Z`;
      }

      if (cw.dueTime) {
        const hours = String(cw.dueTime.hours || 23).padStart(2, '0');
        const minutes = String(cw.dueTime.minutes || 59).padStart(2, '0');
        dueTimeStr = `${hours}:${minutes}`;
      }

      items.push({
        id: `gc-${cw.id}`,
        courseId,
        courseName,
        title: cw.title,
        description: cw.description,
        dueDate: dueDateStr,
        dueTime: dueTimeStr,
        alternateLink: cw.alternateLink,
        maxPoints: cw.maxPoints,
        completed: false,
        notifyEnabled: true,
      });
    });

    return items;
  }
}
