#!/usr/bin/env node
import { readFile, writeFile } from 'fs/promises';
import { GltfTransform } from '3d-tiles-tools';

const glbPaths = process.argv.slice(2);

// Get IO with 3D Tiles extensions registered (once for all files)
const io = await GltfTransform.getIO();

for (const glbPath of glbPaths) {
  try {
    // Read GLB
    const glbData = await readFile(glbPath);

    // Read document (auto-decodes Draco)
    const document = await io.readBinary(new Uint8Array(glbData));

    // Remove Draco extension manually
    const root = document.getRoot();
    const extensionsUsed = root.listExtensionsUsed();
    let dracoFound = false;
    for (const ext of extensionsUsed) {
      if (ext.extensionName === 'KHR_draco_mesh_compression') {
        ext.dispose();
        dracoFound = true;
      }
    }
    if (!dracoFound) {
      console.log(`Skip uncompressed: ${glbPath}`);
      continue;
    }

    // Write back
    const outputGlb = await io.writeBinary(document);
    await writeFile(glbPath, Buffer.from(outputGlb));

    console.log(`Decompressed: ${glbPath}`);
  } catch (error) {
    console.error(`Error processing ${glbPath}: ${error.message}`);
    process.exit(1);
  }
}
