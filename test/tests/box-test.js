const { expect } = require("chai");

describe("Box", function () {
    let Box, box, owner, addr1;

    beforeEach(async function () {
        Box = await ethers.getContractFactory("Box");
        [owner, addr1] = await ethers.getSigners();

        box = await Box.deploy();
        await box.deployed();
    });

    it("Should mint a new company and track details correctly", async function () {
        await box.mintCompany("TechStartup");
        
        const userCompanies = await box.getUserCompanies(owner.address);
        expect(userCompanies.length).to.equal(1);
        
        const details = await box.getCompanyDetails(0);
        expect(details.name).to.equal("TechStartup");
        expect(details.owner).to.equal(owner.address);
    });

    it("Should track total minted companies", async function () {
        await box.mintCompany("Company1");
        await box.mintCompany("Company2");
        
        const totalMinted = await box.getTotalMinted();
        expect(totalMinted).to.equal(2);
    });

    it("Should track companies per user", async function () {
        await box.mintCompany("Company1");
        await box.connect(addr1).mintCompany("Company2");
        
        const ownerCompanies = await box.getUserCompanies(owner.address);
        const addr1Companies = await box.getUserCompanies(addr1.address);
        
        expect(ownerCompanies.length).to.equal(1);
        expect(addr1Companies.length).to.equal(1);
    });
});
