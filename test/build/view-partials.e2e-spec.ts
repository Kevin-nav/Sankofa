import hbs from 'hbs';
import path from 'node:path';
import { configureApp } from '../../src/app.setup';

type AppStub = {
  setBaseViewsDir: (directory: string) => void;
  setViewEngine: (engine: string) => void;
  use: (...args: unknown[]) => AppStub;
  useStaticAssets: (directory: string) => void;
  useGlobalFilters: (...args: unknown[]) => AppStub;
};

function clearRegisteredPartials(): void {
  for (const key of Object.keys(hbs.handlebars.partials)) {
    delete hbs.handlebars.partials[key];
  }
}

describe('View partial registration', () => {
  afterEach(() => {
    clearRegisteredPartials();
  });

  it('registers shared partials before the first render can happen', () => {
    let baseViewsDirectory = '';
    let selectedEngine = '';
    let staticAssetsDirectory = '';

    let appStub: AppStub;

    appStub = {
      setBaseViewsDir: (directory) => {
        baseViewsDirectory = directory;
      },
      setViewEngine: (engine) => {
        selectedEngine = engine;
      },
      use: () => appStub,
      useStaticAssets: (directory) => {
        staticAssetsDirectory = directory;
      },
      useGlobalFilters: () => appStub,
    };

    clearRegisteredPartials();
    configureApp(appStub as unknown as Parameters<typeof configureApp>[0]);

    expect(baseViewsDirectory).toBe(path.join(process.cwd(), 'src', 'views'));
    expect(selectedEngine).toBe('hbs');
    expect(staticAssetsDirectory).toBe(path.join(process.cwd(), 'src', 'public'));
    expect(Object.keys(hbs.handlebars.partials)).toEqual(
      expect.arrayContaining(['header', 'sidebar']),
    );
  });
});
