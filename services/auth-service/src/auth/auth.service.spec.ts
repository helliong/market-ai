import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;

  const prismaServiceMock = {
    account: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    userSeller: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    sellerLegalProfile: {
      upsert: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const jwtServiceMock = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const configServiceMock = {
    get: jest.fn(),
  };

  const emailServiceMock = {
    sendVerificationCode: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: prismaServiceMock,
        },
        {
          provide: JwtService,
          useValue: jwtServiceMock,
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
        {
          provide: EmailService,
          useValue: emailServiceMock,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('syncs seller legal name and INN when legal profile is saved', async () => {
    const seller = {
      id: 'seller-id',
      accountId: 'account-id',
      status: 'PENDING_LEGAL_DATA',
    };
    const savedLegalProfile = {
      id: 'legal-profile-id',
      sellerId: seller.id,
      businessType: 'individual',
      taxId: '123456789012',
      legalName: 'IP MarketAI Store',
      legalAddress: 'Yekaterinburg, Lenina 1',
      bankName: 'MarketAI Bank',
      iban: 'KZ000000000000000000',
    };

    prismaServiceMock.userSeller.findUnique.mockResolvedValue(seller);
    prismaServiceMock.sellerLegalProfile.upsert.mockResolvedValue(
      savedLegalProfile,
    );
    prismaServiceMock.userSeller.update.mockResolvedValue({
      ...seller,
      legalName: savedLegalProfile.legalName,
      inn: savedLegalProfile.taxId,
    });
    prismaServiceMock.$transaction.mockImplementation((callback) =>
      callback(prismaServiceMock),
    );

    await expect(
      service.upsertSellerLegalProfile('account-id', {
        businessType: 'individual',
        taxId: '123 456 789 012',
        legalName: ' IP MarketAI Store ',
        legalAddress: ' Yekaterinburg, Lenina 1 ',
        bankName: ' MarketAI Bank ',
        iban: ' kz00 0000 0000 0000 0000 ',
      }),
    ).resolves.toEqual(savedLegalProfile);

    expect(prismaServiceMock.userSeller.update).toHaveBeenCalledWith({
      where: { id: seller.id },
      data: {
        legalName: savedLegalProfile.legalName,
        inn: savedLegalProfile.taxId,
      },
    });
  });
});
