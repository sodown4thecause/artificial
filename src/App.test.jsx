import { render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import App from './App.jsx';

test('landing page shows CTA to auth', async () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  );

  await waitForElementToBeRemoved(() => screen.queryByText(/Loading/i));

  const ctas = screen.getAllByRole('link', { name: /start free trial/i });
  expect(ctas[0]).toHaveAttribute('href', '/auth');
});

