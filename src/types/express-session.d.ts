import 'express-session';
import { SessionUser } from '../auth/session.types';

declare module 'express-session' {
  interface SessionData {
    user?: SessionUser;
    csrfToken?: string;
    adminSessionVerifiedAt?: string;
  }
}
