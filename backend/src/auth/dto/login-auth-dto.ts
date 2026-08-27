/* eslint-disable @typescript-eslint/no-unsafe-return */
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class LoginAuthDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address.',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({
    example: 'StrongPassword123!',
    description: 'User password.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  password!: string;
}
