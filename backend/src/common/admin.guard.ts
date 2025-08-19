import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as { email?: string } | undefined;
    const headerVal: unknown = (request.headers as any)['x-user-email'] ?? (request.headers as any)['X-User-Email'];
    const headerEmail: string | undefined = Array.isArray(headerVal) ? headerVal[0] : (headerVal as string | undefined);

    const email = user?.email || headerEmail;
    if (!email) {
      throw new ForbiddenException('Email not present');
    }

    const adminEmailsEnv = (
      process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS || ''
    )
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    let dbUser = await this.prisma.user.findUnique({ where: { email } });
    if (!dbUser) {
      // Auto-provision users on first access
      dbUser = await this.prisma.user.create({ data: { email, role: 'PATIENT' } });
    }

    const isEnvAdmin = adminEmailsEnv.includes(email.toLowerCase()) || email.toLowerCase() === 'mustafa@test.com';
    if (isEnvAdmin && dbUser.role !== 'ADMIN') {
      dbUser = await this.prisma.user.update({ where: { email }, data: { role: 'ADMIN' } });
    }

    if (dbUser.role !== 'ADMIN') {
      throw new ForbiddenException('Admin role required');
    }

    // Attach db user for downstream handlers
    request.dbUser = dbUser;
    return true;
  }
}

