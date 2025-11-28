import { initSessionStorage } from "~/session.server";
import { UserService } from "./user.server";
import { type ContextProvider } from "~/context";

export class AuthService {
  private context: ContextProvider;

  constructor(context: ContextProvider) {
    this.context = context;
  }

  async getCurrentUser(request: Request) {
    console.log("AuthService: getCurrentUser called", request.url);

    const sessionStorage = initSessionStorage(this.context);
    const session = await sessionStorage.getSession(request.headers.get("Cookie"));

    const userId = session.get("userId");

    if (!userId) {
      return null;
    }

    const userService = new UserService(this.context);
    const user = await userService.getUser(userId);

    return user;
  }
}