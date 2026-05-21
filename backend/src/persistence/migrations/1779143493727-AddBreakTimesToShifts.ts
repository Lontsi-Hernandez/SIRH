import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBreakTimesToShifts1779143493727 implements MigrationInterface {
    name = 'AddBreakTimesToShifts1779143493727'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'shifts' AND column_name = 'break_start_time'
                ) THEN
                    ALTER TABLE "shifts" ADD "break_start_time" TIMESTAMP WITH TIME ZONE;
                END IF;
            END $$;
        `);
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'shifts' AND column_name = 'break_end_time'
                ) THEN
                    ALTER TABLE "shifts" ADD "break_end_time" TIMESTAMP WITH TIME ZONE;
                END IF;
            END $$;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "shifts" DROP COLUMN IF EXISTS "break_end_time"`);
        await queryRunner.query(`ALTER TABLE "shifts" DROP COLUMN IF EXISTS "break_start_time"`);
    }
}

