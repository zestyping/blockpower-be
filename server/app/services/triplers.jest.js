import { buildTriplerSearchQuery } from './triplers';

const mockUser = {
  id: '123',
  address: JSON.stringify({
    zip: '12345',
  }),
}

const userNode = {
  get: (field) => mockUser[field],
};

describe('triplers search query', () => {
  it('without any parameters', () => {
    expect(searchQuery({})).toMatchSnapshot();
  })

  it('with firstName only', () => {
    expect(searchQuery({ firstName: "Foo" })).toMatchSnapshot();
  })

  it('with lastName only', () => {
    expect(searchQuery({ lastName: "Bar" })).toMatchSnapshot();
  })

  it('with fullName only', () => {
    expect(searchQuery({ firstName: "Foo", lastName: "Bar" })).toMatchSnapshot();
  })

  it('with age only', () => {
    expect(searchQuery({ age: "20-29" })).toMatchSnapshot();
  })

  it('with everything', () => {
    expect(searchQuery({
      firstName: "Foo",
      lastName: "Bar",
      phone: "555-1212",
      distance: 0.5,
      age: "20-29",
      gender: "F",
      msa: "Jacksonville, FL area"
    })).toMatchSnapshot();
  })
})

function searchQuery(query) {
  return buildTriplerSearchQuery({ query, user: userNode });
}
