import fs from 'node:fs/promises';
import path from 'node:path';

type AssetConfig = {
  include: string;
  outDir: string;
};

describe('Build asset configuration', () => {
  it('copies views and public assets into dist for the compiled runtime', async () => {
    const configPath = path.join(process.cwd(), 'nest-cli.json');
    const rawConfig = await fs.readFile(configPath, 'utf8');
    const parsedConfig = JSON.parse(rawConfig) as {
      compilerOptions?: {
        assets?: AssetConfig[];
      };
    };

    expect(parsedConfig.compilerOptions?.assets).toEqual(
      expect.arrayContaining<AssetConfig>([
        expect.objectContaining({
          include: 'views/**/*',
          outDir: 'dist',
        }),
        expect.objectContaining({
          include: 'public/**/*',
          outDir: 'dist',
        }),
      ]),
    );
  });
});
