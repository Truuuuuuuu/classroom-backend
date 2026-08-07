import express from "express";
import {
  or,
  ilike,
  and,
  sql,
  eq,
  getTableColumns,
  desc,
  count,
} from "drizzle-orm";
import { subjects, departments } from "../db/schema/index.js";
import { db } from "../db/index.js";

const router = express.Router();

//get alls subjest w/ optional search, filtering and pagination
router.get("/", async (req, res) => {
  try {
    const { search, department, page = 1, limit = 10 } = req.query;

    // const currentPage = Math.max(1, +page);
    // const limitPerPage = Math.max(1, +limit);

    // const offset = (currentPage - 1) * limitPerPage;

    const currentPage = Number(page);
    const requestedLimit = Number(limit);

    if (
      !Number.isSafeInteger(currentPage) ||
      !Number.isSafeInteger(requestedLimit) ||
      currentPage < 1 ||
      requestedLimit < 1
    ) {
      return res.status(400).json({
        error: "page and limit must be positive integers",
      });
    }

    const limitPerPage = Math.min(requestedLimit, 100);
    const offset = (currentPage - 1) * limitPerPage;

    const filterConditions = [];

    //If search query is provided, filter subjects by name OR code
    if (search) {
      filterConditions.push(
        or(
          ilike(subjects.name, `%${search}%`),
          ilike(subjects.code, `%${search}%`),
        ),
      );
    }

    //If department query is provided, filter subjects by department name
    if (department) {
      filterConditions.push(or(ilike(departments.name, `%${department}%`)));
    }

    //combine all filter conditions using AND operator
    const whereClause =
      filterConditions.length > 0 ? and(...filterConditions) : undefined;

    const countResult = await db
      .select({ count: count() })
      .from(subjects)
      .leftJoin(departments, eq(subjects.departmentId, departments.id))
      .where(whereClause);

    const totalCount = countResult[0]?.count ?? 0;

    const subjectsList = await db
      .select({
        ...getTableColumns(subjects),
        department: { ...getTableColumns(departments) },
      })
      .from(subjects)
      .leftJoin(departments, eq(subjects.departmentId, departments.id))
      .where(whereClause)
      .orderBy(desc(subjects.createdAt))
      .limit(limitPerPage)
      .offset(offset);

    res.status(200).json({
      data: subjectsList,
      pagination: {
        page: currentPage,
        limit: limitPerPage,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitPerPage),
      },
    });
  } catch (e) {
    console.error(`Error while getting subjects: ${e}`);
    res.status(500).json({ error: "Failed to get subjects" });
  }
});

export default router;
