import { UniversalAgent } from '@/core/agent';

// Create a singleton instance of the Universal Agent
export const agent = new UniversalAgent();

// Register mock capabilities for testing
agent.registry.register({
  name: 'getUsers',
  description: 'Returns the entire list of users present in the mock DB.',
  schema: {
    type: "object",
    properties: {}
  },
  execute: async () => {
    return {
      success: true,
      data: [
        { id: "u1", name: "Alice", role: "admin" },
        { id: "u2", name: "Bob", role: "user" },
        { id: "u3", name: "Charlie", role: "editor" }
      ]
    };
  }
});

agent.registry.register({
  name: 'updateUserRole',
  description: 'Updates the role of a specific user.',
  schema: {
    type: "object",
    properties: {
      userId: { type: "string", description: "The ID of the user to update." },
      newRole: { type: "string", description: "The new role to assign." }
    },
    required: ["userId", "newRole"]
  },
  execute: async (params: any) => {
    const { userId, newRole } = params || {};
    if (!userId || typeof userId !== 'string') {
      throw new Error("Invalid 'userId' parameter. Must be a non-empty string.");
    }
    if (!newRole || typeof newRole !== 'string') {
      throw new Error("Invalid 'newRole' parameter. Must be a non-empty string.");
    }
    
    // Mock user update
    return {
      success: true,
      data: { id: userId, name: "MockUser", role: newRole }
    };
  }
});
