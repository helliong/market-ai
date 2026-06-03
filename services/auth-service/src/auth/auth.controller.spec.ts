import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const authServiceMock = {
    register: jest.fn(),
    registerSeller: jest.fn(),
    verifyEmail: jest.fn(),
    login: jest.fn(),
    sellerLogin: jest.fn(),
    refreshTokens: jest.fn(),
    getMe: jest.fn(),
    getUserMe: jest.fn(),
    getSellerMe: jest.fn(),
    upsertSellerLegalProfile: jest.fn(),
    submitSellerLegalProfile: jest.fn(),
    getSellersForReview: jest.fn(),
    approveSeller: jest.fn(),
    rejectSeller: jest.fn(),
    forgotPassword: jest.fn(),
    forgotSellerPassword: jest.fn(),
    resendVerificationCode: jest.fn(),
    verifyResetPasswordCode: jest.fn(),
    verifySellerResetPasswordCode: jest.fn(),
    resetPassword: jest.fn(),
    resetSellerPassword: jest.fn(),
    logout: jest.fn(),
  };

  const configServiceMock = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
