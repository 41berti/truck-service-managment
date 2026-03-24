class IRepository {
  async getAll() {
    throw new Error("getAll() must be implemented");
  }

  async getById(id) {
    throw new Error("getById() must be implemented");
  }

  async add(entity) {
    throw new Error("add() must be implemented");
  }

  async save() {
    throw new Error("save() must be implemented");
  }
}

module.exports = IRepository;