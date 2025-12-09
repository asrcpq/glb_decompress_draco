#!/usr/bin/env node
import { readFile, writeFile } from 'fs/promises';
import { GltfTransform } from '3d-tiles-tools';

const glbPath = process.argv[2];
if (!glbPath) {
  console.error('Usage: glb-decompress <glb-file>');
  process.exit(1);
}

try {
  // Read GLB
  const glbData = await readFile(glbPath);

  // Get IO with 3D Tiles extensions registered
  const io = await GltfTransform.getIO();

  // Read document (auto-decodes Draco)
  const document = await io.readBinary(new Uint8Array(glbData));

  // Remove Draco extension manually
  const root = document.getRoot();
  const extensionsUsed = root.listExtensionsUsed();
  for (const ext of extensionsUsed) {
    if (ext.extensionName === 'KHR_draco_mesh_compression') {
      ext.dispose();
    }
  }

  // Write back
  const outputGlb = await io.writeBinary(document);
  await writeFile(glbPath, Buffer.from(outputGlb));

  console.log(`✓ Decompressed: ${glbPath}`);
} catch (error) {
  console.error(`✗ Failed: ${error.message}`);
  process.exit(1);
}
