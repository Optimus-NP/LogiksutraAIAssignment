export default {
  'no console.log': {
    test: () => /console\.log/g,
    constraint: 0,
  },
  'no any types': {
    test: () => /:\s*any/g,
    constraint: 0,
  },
};
