import {
    IsEnum,
    IsString,
    Length,
    Matches,
    ValidateIf,
} from 'class-validator';
import { PaymentMethod } from '../enums/paymentMethod.enum';
import { MobileMoneyProvider } from '../enums/mobileMoneyProvider.enum';

export class PayOrderDto {
    @IsEnum(PaymentMethod)
    method: PaymentMethod;

    @ValidateIf((dto: PayOrderDto) => dto.method === PaymentMethod.CARD)
    @IsString()
    @Matches(/^\d{16}$/, { message: 'cardNumber must be 16 digits' })
    cardNumber?: string;

    @ValidateIf((dto: PayOrderDto) => dto.method === PaymentMethod.CARD)
    @IsString()
    @Length(2, 80)
    cardHolderName?: string;

    @ValidateIf((dto: PayOrderDto) => dto.method === PaymentMethod.CARD)
    @IsString()
    @Matches(/^(0[1-9]|1[0-2])$/, { message: 'expiryMonth must be 01-12' })
    expiryMonth?: string;

    @ValidateIf((dto: PayOrderDto) => dto.method === PaymentMethod.CARD)
    @IsString()
    @Matches(/^\d{2}$/, { message: 'expiryYear must be 2 digits' })
    expiryYear?: string;

    @ValidateIf((dto: PayOrderDto) => dto.method === PaymentMethod.CARD)
    @IsString()
    @Matches(/^\d{3}$/, { message: 'cvv must be 3 digits' })
    cvv?: string;

    @ValidateIf((dto: PayOrderDto) => dto.method === PaymentMethod.MOBILE_MONEY)
    @IsEnum(MobileMoneyProvider)
    provider?: MobileMoneyProvider;

    @ValidateIf((dto: PayOrderDto) => dto.method === PaymentMethod.MOBILE_MONEY)
    @IsString()
    @Matches(/^\+?[0-9]{10,15}$/, {
        message: 'phoneNumber must be a valid mobile number',
    })
    phoneNumber?: string;
}
