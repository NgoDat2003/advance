import { Controller, Get } from '@nestjs/common';
import { Booking } from '../domain/booking.ts';

@Controller('bookings')
export class BookingsController {
  // Trả thẳng Entity ra client.
  @Get(':id')
  async get(): Promise<Booking> {
    return new Booking();
  }
}
