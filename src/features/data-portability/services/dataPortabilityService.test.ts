import { describe, it, expect } from "vitest";
import { buildExportData, parseImportData } from "./dataPortabilityService";

describe("buildExportData", () => {
  const applications = [
    {
      id: "app-1",
      companyName: "TestCorp",
      jobTitle: "Frontend Dev",
      status: "applied" as const,
      appliedAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  ];

  const resumes = [
    {
      id: "res-1",
      name: "My Resume",
      targetRole: "Frontend Dev",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  ];

  const interviews = [
    {
      id: "int-1",
      jobApplicationId: "app-1",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  ];

  it('returns object with app = "developer-job-hunt-crm" and version = 1', () => {
    const result = buildExportData({ applications, resumes, interviews });
    expect(result.app).toBe("developer-job-hunt-crm");
    expect(result.version).toBe(1);
  });

  it("contains exportedAt as a valid ISO date string", () => {
    const result = buildExportData({ applications, resumes, interviews });
    expect(result.exportedAt).toBeDefined();
    const parsed = new Date(result.exportedAt);
    expect(parsed.toISOString()).toBe(result.exportedAt);
  });

  it("passes through applications, resumes, interviews arrays", () => {
    const result = buildExportData({ applications, resumes, interviews });
    expect(result.applications).toBe(applications);
    expect(result.resumes).toBe(resumes);
    expect(result.interviews).toBe(interviews);
  });
});

describe("parseImportData", () => {
  const validExport = {
    app: "developer-job-hunt-crm",
    version: 1,
    exportedAt: "2026-06-01T00:00:00.000Z",
    applications: [
      {
        id: "app-1",
        companyName: "TestCorp",
        jobTitle: "Frontend Dev",
        status: "applied",
      },
    ],
    resumes: [
      {
        id: "res-1",
        name: "My Resume",
        targetRole: "Frontend Dev",
      },
    ],
    interviews: [
      {
        id: "int-1",
        jobApplicationId: "app-1",
      },
    ],
  };

  it("returns parsed data for valid JSON with correct app and version", () => {
    const result = parseImportData(JSON.stringify(validExport));
    expect(result.app).toBe("developer-job-hunt-crm");
    expect(result.version).toBe(1);
    expect(result.applications).toHaveLength(1);
    expect(result.applications[0].id).toBe("app-1");
    expect(result.resumes).toHaveLength(1);
    expect(result.interviews).toHaveLength(1);
  });

  it('throws "导入文件格式不匹配" when app field is wrong', () => {
    const data = { ...validExport, app: "wrong-app" };
    expect(() => parseImportData(JSON.stringify(data))).toThrow(
      "导入文件格式不匹配",
    );
  });

  it('throws "导入文件格式不匹配" when version is wrong', () => {
    const data = { ...validExport, version: 2 };
    expect(() => parseImportData(JSON.stringify(data))).toThrow(
      "导入文件格式不匹配",
    );
  });

  it('throws "导入文件缺少必要的数据列表" when applications array is missing', () => {
    const { applications: _a, ...rest } = validExport;
    expect(() => parseImportData(JSON.stringify(rest))).toThrow(
      "导入文件缺少必要的数据列表",
    );
  });

  it('throws "导入文件缺少必要的数据列表" when resumes array is missing', () => {
    const { resumes: _r, ...rest } = validExport;
    expect(() => parseImportData(JSON.stringify(rest))).toThrow(
      "导入文件缺少必要的数据列表",
    );
  });

  it("filters out records missing required fields (no id, companyName, jobTitle, status)", () => {
    const data = {
      ...validExport,
      applications: [{ foo: "bar" }],
    };
    const result = parseImportData(JSON.stringify(data));
    expect(result.applications).toHaveLength(0);
  });

  it("keeps only valid records when partial data is present", () => {
    const data = {
      ...validExport,
      applications: [
        { id: "app-1", companyName: "Corp", jobTitle: "Dev", status: "applied" },
        { companyName: "Corp" }, // missing id, jobTitle, status
        { id: "app-2", companyName: "Corp2", jobTitle: "Dev2", status: "interview" },
      ],
    };
    const result = parseImportData(JSON.stringify(data));
    expect(result.applications).toHaveLength(2);
    expect(result.applications[0].id).toBe("app-1");
    expect(result.applications[1].id).toBe("app-2");
  });

  it("preserves extra fields on valid records", () => {
    const data = {
      ...validExport,
      applications: [
        {
          id: "app-1",
          companyName: "Corp",
          jobTitle: "Dev",
          status: "applied",
          extraField: "extra value",
          notes: "some notes",
        },
      ],
    };
    const result = parseImportData(JSON.stringify(data));
    expect(result.applications).toHaveLength(1);
    expect((result.applications[0] as Record<string, unknown>).extraField).toBe(
      "extra value",
    );
    expect((result.applications[0] as Record<string, unknown>).notes).toBe(
      "some notes",
    );
  });
});
