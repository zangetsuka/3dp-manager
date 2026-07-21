import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  Res,
  Logger,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';

interface LoginDto {
  login: string;
  password: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Public()
  @Throttle({
    default: { limit: 5, ttl: 60000 },
  })
  @ApiOperation({ summary: 'Авторизация', description: 'Вход в панель управления' })
  @ApiResponse({ status: 201, description: 'Успешный вход' })
  @ApiResponse({ status: 401, description: 'Неверный логин или пароль' })
  @Post('login')
  async login(
    @Body() req: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.logger.debug(`Login request received for user: ${req.login}`);
    const user = await this.authService.validateUser(req.login, req.password);
    if (!user) {
      this.logger.warn(`Login failed for user: ${req.login}`);
      throw new HttpException(
        'Неверный логин или пароль',
        HttpStatus.UNAUTHORIZED,
      );
    }
    const { access_token } = this.authService.login(user as { login: string });

    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';
    this.logger.debug(
      `Login succeeded for user: ${req.login}. Setting auth cookie (secure=${isProduction}, sameSite=lax, maxAgeMs=86400000)`,
    );
    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    });

    this.logger.debug(`Login response prepared for user: ${req.login}`);
    return { access_token };
  }

  @Public()
  @ApiOperation({ summary: 'Выход', description: 'Выход из системы и очистка cookie' })
  @ApiResponse({ status: 201, description: 'Успешный выход' })
  @Post('logout')
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const hadCookie = Boolean(
      (req.cookies as Record<string, unknown> | undefined)?.access_token,
    );
    this.logger.debug(`Logout request received. Cookie present: ${hadCookie}`);

    // Очищаем httpOnly cookie
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
    });
    this.logger.debug(
      `Auth cookie cleared (secure=${isProduction}, sameSite=lax, path=/)`,
    );

    return { success: true };
  }

  @ApiOperation({ summary: 'Смена пароля', description: 'Изменение пароля администратора' })
  @ApiResponse({ status: 201, description: 'Пароль изменён' })
  @Post('change-password')
  async changePassword(@Body('password') password: string) {
    await this.authService.changePassword(password);
    return { success: true };
  }

  @ApiOperation({ summary: 'Обновление профиля', description: 'Обновление логина и/или пароля администратора' })
  @ApiResponse({ status: 201, description: 'Профиль обновлён' })
  @Post('update-profile')
  async updateProfile(@Body() body: { login: string; password?: string }) {
    await this.authService.updateAdminProfile(body.login, body.password);
    return { success: true };
  }
}
