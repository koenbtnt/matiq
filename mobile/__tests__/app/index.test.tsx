import '../../src/i18n';

import { render, screen } from '@testing-library/react-native';

import Index from '../../app/index';
import { countAppMeta } from '../../src/repositories/appMeta';

jest.mock('../../src/repositories/appMeta', () => ({
  countAppMeta: jest.fn(),
}));

const mockedCount = jest.mocked(countAppMeta);

describe('Home screen', () => {
  beforeEach(() => mockedCount.mockResolvedValue(0));

  it('renders the title and reports the database as ready', async () => {
    await render(<Index />);

    expect(screen.getByTestId('home.title')).toHaveTextContent('matIQ');
    expect(await screen.findByTestId('db.ready')).toHaveTextContent('Database ready');
    expect(mockedCount).toHaveBeenCalledTimes(1);
  });
});
