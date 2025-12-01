#!/usr/bin/env bun
/**
 * Script untuk verify apakah column folder sudah ada di database
 * dan menambahkannya jika belum ada
 */

import { prisma } from '../lib/prisma';

async function verifyAndAddFolderColumn() {
  try {
    console.log('🔍 Checking if folder column exists...');
    
    // Cek apakah ada preset dengan folder
    const presets = await prisma.preset.findMany({
      take: 1,
      select: {
        id: true,
        name: true,
        folder: true,
      },
    });

    console.log('✅ Prisma Client connected successfully');
    console.log('📊 Sample preset:', presets[0] || 'No presets found');
    
    // Coba query dengan folder
    const presetsWithFolder = await prisma.preset.findMany({
      where: {
        folder: null,
      },
      take: 1,
    });
    
    console.log('✅ Folder column exists and is queryable!');
    console.log(`📁 Found ${presetsWithFolder.length} presets with null folder`);
    
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Unknown column') || error.message.includes('column') && error.message.includes('does not exist')) {
        console.error('❌ Folder column does NOT exist in database!');
        console.error('💡 Please run: bun run db:push (with DIRECT_URL set)');
        console.error('   Or manually: psql $DIRECT_URL -f scripts/apply-migration-folder.sql');
      } else {
        console.error('❌ Error:', error.message);
      }
    } else {
      console.error('❌ Unknown error:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

verifyAndAddFolderColumn();

