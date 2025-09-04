import ProductHistory from '../../models/productHistory.model.js';

export default async function getAuditHistory(filters = {}, user) {
  try {
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const query = {};

    if (filters.gtin) {
      query.gtin = filters.gtin;
    }

    if (filters.action) {
      query.action = filters.action;
    }

    if (filters.changedBy) {
      query.changedBy = filters.changedBy;
    }

    if (filters.name) {
      query.$or = [
        { 'newData.name': { $regex: filters.name, $options: 'i' } },
        { 'previousData.name': { $regex: filters.name, $options: 'i' } },
      ];
    }

    if (filters.dateFrom || filters.dateTo) {
      query.changedAt = {};
      if (filters.dateFrom) {
        query.changedAt.$gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        query.changedAt.$lte = new Date(filters.dateTo);
      }
    }

    if (user.role === 'provider') {
      const userId = user.id || user._id;
      query.changedBy = userId;
    }

    const limit = Math.min(filters.limit || 10, 100);
    const offset = filters.offset || 0;

    const history = await ProductHistory.find(query)
      .populate('changedBy', 'name email role')
      .sort({ changedAt: -1 })
      .limit(limit)
      .skip(offset);

    return history.map((doc) => {
      const entry = doc.toObject();
      return {
        ...entry,
        changedBy: entry.changedBy
          ? {
              ...entry.changedBy,
              id: entry.changedBy._id
                ? entry.changedBy._id.toString()
                : entry.changedBy.id,
            }
          : null,
      };
    });
  } catch (error) {
    console.error('Error in getAuditHistory:', error);
    throw error;
  }
}
