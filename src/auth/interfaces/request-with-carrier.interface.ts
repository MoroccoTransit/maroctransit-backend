// eslint-disable-next-line no-redeclare
import { Request } from 'express';
import { Carrier } from 'src/users/entities/carrier.entity';

export interface RequestWithCarrier extends Request {
  carrier: Carrier;
}
