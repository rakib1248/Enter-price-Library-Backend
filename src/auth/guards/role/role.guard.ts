import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { ROLES_KEY } from '../../decorators/role/role.decorator';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) return true; // role না থাকলে public

    const request = context
      .switchToHttp()
      .getRequest<Request & { user: { role: Role } }>();
    const { user } = request;
    return requiredRoles.includes(user.role);
  }
}
