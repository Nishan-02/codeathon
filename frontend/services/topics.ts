import {
  getTopics,
  createTopic,
  updateTopic,
  deleteTopic,
} from '../lib/firebase/firestore';
import { Topic, CreateTopicInput, UpdateTopicInput } from '../types/topic';

export const TopicService = {
  getBySubject: (subjectId: string | number) => getTopics(subjectId),
  getAll: () => getTopics(),
  create: (subjectId: string | number, data: CreateTopicInput) => createTopic(subjectId, data),
  update: (id: string | number, data: UpdateTopicInput) => updateTopic(id, data),
  delete: (id: string | number) => deleteTopic(id),
};
