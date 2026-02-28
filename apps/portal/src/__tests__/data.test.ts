import { describe, it, expect } from 'bun:test';
import { getAllApps, getAppById, getCategories } from '../data/apps';

describe('getAppById', () => {
  it('存在するIDでアプリを返す', () => {
    const app = getAppById('task-mgmt');
    expect(app).toBeDefined();
    expect(app?.id).toBe('task-mgmt');
    expect(app?.name).toBe('タスク管理');
  });

  it('存在しないIDでundefinedを返す', () => {
    const app = getAppById('non-existent-app');
    expect(app).toBeUndefined();
  });

  it('空文字でundefinedを返す', () => {
    const app = getAppById('');
    expect(app).toBeUndefined();
  });
});

describe('getCategories', () => {
  it('カテゴリの配列を返す', () => {
    const categories = getCategories();
    expect(categories).toBeInstanceOf(Array);
    expect(categories.length).toBeGreaterThan(0);
  });

  it('重複のないカテゴリを返す', () => {
    const categories = getCategories();
    const unique = new Set(categories);
    expect(unique.size).toBe(categories.length);
  });

  it('ソート済みのカテゴリを返す', () => {
    const categories = getCategories();
    const sorted = [...categories].sort();
    expect(categories).toEqual(sorted);
  });
});

describe('getAllApps', () => {
  it('activeのアプリがbetaより先に来る', () => {
    const apps = getAllApps();
    const activeIndex = apps.findIndex((a) => a.status === 'active');
    const betaIndex = apps.findIndex((a) => a.status === 'beta');
    if (activeIndex !== -1 && betaIndex !== -1) {
      expect(activeIndex).toBeLessThan(betaIndex);
    }
  });

  it('元の配列を変更しない（immutable）', () => {
    const apps1 = getAllApps();
    const apps2 = getAllApps();
    expect(apps1).not.toBe(apps2);
    expect(apps1).toEqual(apps2);
  });
});
