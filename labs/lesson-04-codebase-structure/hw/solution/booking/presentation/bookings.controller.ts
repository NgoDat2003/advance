import type { BookFlightUseCase } from '../application/book-flight.use-case.ts';
import type { BookFlightCommand, BookFlightResult } from '../application/book-flight.dto.ts';

export class BookingsController {
  constructor(_bookFlight: BookFlightUseCase) {}
  async create(_body: BookFlightCommand): Promise<BookFlightResult | undefined> {
    return undefined;
  }
}
