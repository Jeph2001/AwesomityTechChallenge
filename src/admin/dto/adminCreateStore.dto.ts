import { IsUUID } from 'class-validator';
import { CreateStoreDto } from 'src/stores/dto/createStore.dto';

export class AdminCreateStoreDto extends CreateStoreDto {
    @IsUUID()
    ownerId: string;
}
