import mongoose, { type InferSchemaType } from 'mongoose';

/**
 * Board model using Mongoose
 * Per CLAUDE.md: Sparse coordinate storage (DS2)
 * Stores board state as array of [x, y] pairs
 */

const boardSchema = new mongoose.Schema(
  {
    boardId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    // Sparse representation: array of [row, col] pairs for live cells only
    state: {
      type: [[Number]],
      required: true,
      validate: {
        validator: (value: number[][]) => {
          return value.every((coord) => coord.length === 2);
        },
        message: 'Each coordinate must be [row, col] pair',
      },
    },
    dimensions: {
      rows: {
        type: Number,
        required: true,
        min: 1,
      },
      cols: {
        type: Number,
        required: true,
        min: 1,
      },
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    collection: 'boards',
  },
);

// Indexes for performance
boardSchema.index({ createdAt: -1 });

export type BoardDocument = InferSchemaType<typeof boardSchema> & {
  createdAt: Date;
  updatedAt: Date;
};

export const BoardModel = mongoose.model('Board', boardSchema);
