"""Copy the existing SQLite database into an empty PostgreSQL database."""

import os
import sys

from sqlalchemy import MetaData, Table, inspect, text
from sqlalchemy.engine import create_engine

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.db import DB_PATH, engine, Base
from database import models  # noqa: F401 - registers ORM tables on Base.metadata


def migrate_sqlite_to_postgres():
    if engine.dialect.name != "postgresql":
        raise RuntimeError("Set DB_TYPE=postgresql before running this migration.")
    if not os.path.isfile(DB_PATH):
        raise FileNotFoundError(f"SQLite database not found: {DB_PATH}")

    source_engine = create_engine(f"sqlite:///{DB_PATH}")
    try:
        source_tables = set(inspect(source_engine).get_table_names())
        target_tables = {table.name for table in Base.metadata.sorted_tables}
        missing_tables = source_tables - target_tables
        if missing_tables:
            raise RuntimeError(
                "SQLite tables have no PostgreSQL model: "
                + ", ".join(sorted(missing_tables))
            )

        Base.metadata.create_all(bind=engine)
        metadata = MetaData()
        with source_engine.connect() as source, engine.begin() as target:
            source_table_objects = {
                name: Table(name, metadata, autoload_with=source_engine)
                for name in source_tables
            }

            for table in Base.metadata.sorted_tables:
                if table.name in source_tables:
                    count = target.execute(
                        text(f'SELECT COUNT(*) FROM "{table.name}"')
                    ).scalar_one()
                    if count:
                        raise RuntimeError(
                            f"PostgreSQL table {table.name!r} is not empty; "
                            "migration stopped to avoid overwriting data."
                        )

            for target_table in Base.metadata.sorted_tables:
                source_table = source_table_objects.get(target_table.name)
                if source_table is None:
                    continue
                source_columns = set(source_table.c.keys())
                target_columns = set(target_table.c.keys())
                if source_columns - target_columns:
                    raise RuntimeError(
                        f"SQLite table {target_table.name!r} has columns not "
                        "defined in the PostgreSQL model."
                    )

                rows = source.execute(source_table.select()).mappings().all()
                for start in range(0, len(rows), 1000):
                    target.execute(
                        target_table.insert(),
                        [dict(row) for row in rows[start : start + 1000]],
                    )
                print(f"Copied {len(rows)} rows from {target_table.name}")

                for column in target_table.columns:
                    if (
                        column.primary_key
                        and column.type.python_type is int
                        and column.autoincrement != False
                    ):
                        quoted_table = engine.dialect.identifier_preparer.quote(
                            target_table.name
                        )
                        quoted_column = engine.dialect.identifier_preparer.quote(
                            column.name
                        )
                        target.execute(
                            text(
                                "SELECT setval("
                                "pg_get_serial_sequence(:table_name, :column_name), "
                                f"COALESCE(MAX({quoted_column}), 1), "
                                f"MAX({quoted_column}) IS NOT NULL) "
                                f"FROM {quoted_table}"
                            ),
                            {
                                "table_name": target_table.name,
                                "column_name": column.name,
                            },
                        )

        print("SQLite data migration completed.")
    finally:
        source_engine.dispose()


if __name__ == "__main__":
    migrate_sqlite_to_postgres()
