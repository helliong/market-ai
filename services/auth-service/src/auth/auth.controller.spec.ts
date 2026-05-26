import { Test, TestingModule } from '@nestjs/testing';
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
  forgotPassword: jest.fn(),
  resendVerificationCode: jest.fn(),
  resetPassword: jest.fn(),
  logout: jest.fn(),
};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock,
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
