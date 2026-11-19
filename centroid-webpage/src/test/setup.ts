import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// unmount whatever a test rendered so tests don't affect each other
afterEach(() => cleanup());
