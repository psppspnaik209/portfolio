import { ReactElement } from 'react';

export interface CustomError {
  status: number;
  title: string;
  subTitle: string | ReactElement;
}

export const INVALID_CONFIG_ERROR: CustomError = {
  status: 500,
  title: 'Invalid Config!',
  subTitle: (
    <p>
      Please provide correct config in <code>gitprofile.config.ts</code>.
    </p>
  ),
};
