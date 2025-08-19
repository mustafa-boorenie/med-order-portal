import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly allowedRoles: string[] = []) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('No user in request');
    }

    const userRole = user.role || user['https://medportal.com/roles'];
    if (!userRole || (this.allowedRoles.length > 0 && !this.allowedRoles.includes(userRole))) {
      throw new ForbiddenException('Insufficient role');
    }

    return true;
  }
}

