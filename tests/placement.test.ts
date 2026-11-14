import { describe, it, expect } from "vitest";
import {
  getPlacementDrives,
  getPlacementDriveById,
  getPlacementDriveWithDetails,
  getCompanyPlacementInformation,
} from "../src/server/queries/placement";

describe("Placement Information Queries", () => {
  it("should fetch placement drives for a company", async () => {
    const drives = await getPlacementDrives("google");
    expect(drives).toBeDefined();
    expect(drives.length).toBeGreaterThan(0);
    expect(drives[0].companyId).toBe("google");
  });

  it("should return empty array for nonexistent company drives", async () => {
    const drives = await getPlacementDrives("nonexistent_company");
    expect(drives).toEqual([]);
  });

  it("should fetch a specific placement drive by id", async () => {
    const drive = await getPlacementDriveById("drive_google_fall_2024");
    expect(drive).toBeDefined();
    expect(drive?.id).toBe("drive_google_fall_2024");
    expect(drive?.season).toBe("Fall 2024");
  });

  it("should return null for nonexistent drive id", async () => {
    const drive = await getPlacementDriveById("nonexistent_drive");
    expect(drive).toBeNull();
  });

  it("should fetch drive with roles, eligibility, and preparation", async () => {
    const drive = await getPlacementDriveWithDetails("drive_google_fall_2024");
    expect(drive).toBeDefined();
    expect(drive?.id).toBe("drive_google_fall_2024");
    
    expect(drive?.roles).toBeDefined();
    expect(drive?.roles.length).toBeGreaterThan(0);
    
    const sweRole = drive?.roles.find(r => r.roleId === "rt_google_swe");
    expect(sweRole).toBeDefined();
    expect(sweRole?.title).toBe("Software Engineer");
    expect(sweRole?.ctc).toBe("32 LPA");
    
    expect(sweRole?.eligibility).toBeDefined();
    expect(sweRole?.eligibility?.cgpa).toBe("8.0+");
    
    expect(sweRole?.preparation).toBeDefined();
    expect(sweRole?.preparation?.requiredSkills).toContain("Data Structures");
  });

  it("should return full company placement information", async () => {
    const companyInfo = await getCompanyPlacementInformation("google");
    expect(companyInfo).toBeDefined();
    expect(companyInfo.length).toBeGreaterThan(0);
    
    const fallDrive = companyInfo.find(d => d.id === "drive_google_fall_2024");
    expect(fallDrive).toBeDefined();
    expect(fallDrive?.roles.length).toBeGreaterThan(0);
  });
});
