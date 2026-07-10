import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { Role } from 'src/users/enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

describe('RolesGuard', () => {
    const reflector = {
        getAllAndOverride: jest.fn(),
    } as unknown as Reflector;

    const createContext = (user: { role: Role } | undefined) =>
        ({
            getHandler: () => ({}),
            getClass: () => ({}),
            switchToHttp: () => ({
                getRequest: () => ({ user }),
            }),
        }) as any;

    let guard: RolesGuard;

    beforeEach(() => {
        jest.clearAllMocks();
        guard = new RolesGuard(reflector);
    });

    it('allows access when no roles are required', () => {
        (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
        expect(guard.canActivate(createContext({ role: Role.SHOPPER }))).toBe(true);
    });

    it('allows access when user has a required role', () => {
        (reflector.getAllAndOverride as jest.Mock).mockReturnValue([Role.ADMIN]);
        expect(guard.canActivate(createContext({ role: Role.ADMIN }))).toBe(true);
        expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
            expect.anything(),
            expect.anything(),
        ]);
    });

    it('denies access when user role does not match', () => {
        (reflector.getAllAndOverride as jest.Mock).mockReturnValue([Role.ADMIN]);
        expect(() => guard.canActivate(createContext({ role: Role.SHOPPER }))).toThrow(
            ForbiddenException,
        );
    });
});
