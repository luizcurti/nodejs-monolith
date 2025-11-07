import BaseEntity from './base.entity';
import Id from '../value-object/id.value-object';

class TestEntity extends BaseEntity {
  constructor(id?: Id) {
    super(id);
  }
}

describe('BaseEntity Unit Tests', () => {
  it('should create an entity with provided id', () => {
    const id = new Id('123');
    const entity = new TestEntity(id);

    expect(entity.id).toBe(id);
    expect(entity.createdAt).toBeInstanceOf(Date);
    expect(entity.updatedAt).toBeInstanceOf(Date);
  });

  it('should create an entity with generated id when not provided', () => {
    const entity = new TestEntity();

    expect(entity.id).toBeInstanceOf(Id);
    expect(entity.id.id).toBeDefined();
    expect(entity.createdAt).toBeInstanceOf(Date);
    expect(entity.updatedAt).toBeInstanceOf(Date);
  });

  it('should update updatedAt using setter', () => {
    const entity = new TestEntity();
    const newDate = new Date('2023-01-01');

    entity.updatedAt = newDate;

    expect(entity.updatedAt).toBe(newDate);
  });
});
