import { buildTriplerSearchQuery } from './triplers';

const mockUser = {
  id: '123',
  address: {
    zip: '12345',
  }
}

const userNode = {
  get: (field) => mockUser[field],
};

describe('triplers search query', () => {
  it('without any parameters', () => {
    expect(buildTriplerSearchQuery({ query: {}, user: userNode })).toMatchSnapshot();
  })
})
