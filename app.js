
const express=require('express');
const bodyParser=require("body-parser");
const app=express();
const path = require("path");   
app.use(express.json({ limit: '50mb' }));  
app.use("/images", express.static(path.join(__dirname, "images")));
app.use(express.static('public')); // Assuming 'public' is the directory containing 'images'


//opd route
const servicetypeRoute = require("./src/routes/admin/service_type.route");
const titleRoute = require("./src/routes/admin/title.route");
const entityRoute = require("./src/routes/admin/entity.route");
const treatmentRoute = require("./src/routes/admin/treatment.route");
const servicesRoute = require("./src/routes/admin/services.route");
const source_of_patientRoute = require("./src/routes/admin/source_of_patient.route");
const diagnosisRoute = require("./src/routes/admin/diagnosis.route");
const categoryRoute = require("./src/routes/admin/category.route");
const medicinesRoute = require("./src/routes/admin/medicines.routes");
const dosagesRoute = require("./src/routes/admin/dosages.route");
const instructionsRoute = require("./src/routes/admin/instructions.route");
const chief_complaintsRoute = require("./src/routes/admin/chief_complaints.route");
const designationRoute = require("./src/routes/admin/designation.route");
const employeeRoute = require("./src/routes/admin/employee.route");
const refered_byRoute = require("./src/routes/admin/refered_by.route");
const patient_registrationRoute = require("./src/routes/admin/patient_registration.route");
// const patient_entity_seriesRoute = require("./src/routes/patient_entity_series.route");

//receptionist routes
const lead_headerRoute = require("./src/routes/receptionist/leads.route");

//Super admin routes
const wm_customer_headerRoute = require("./src/routes/super_admin/wm_customer_header.route");
const wm_cutomer_typeRoute = require("./src/routes/super_admin/wm_cutomer_type.route");
const wm_modulesRoute = require("./src/routes/super_admin/wm_modules.route");
const super_adminRoute = require("./src/routes/super_admin/super_admin.route");

app.use(bodyParser.json());
app.use((req,res,next)=>{
    res.setHeader("Access-Control-Allow-Origin","*");
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Origin,X-Requested-With,Content-Type,Accept, Authorization"
    );
    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET,POST,PATCH,PUT,DELETE,OPTIONS" 
    );
    next();
});

//opd route
app.use('/api/service_type',servicetypeRoute);
app.use('/api/title',titleRoute);
app.use('/api/entity',entityRoute);
app.use('/api/treatment',treatmentRoute);
app.use('/api/services',servicesRoute);
app.use('/api/source_of_patient',source_of_patientRoute);
app.use('/api/diagnosis',diagnosisRoute);
app.use('/api/category',categoryRoute);
app.use('/api/medicines',medicinesRoute);
app.use('/api/dosages',dosagesRoute);
app.use('/api/instructions',instructionsRoute);
app.use('/api/chief_complaints',chief_complaintsRoute);
app.use('/api/designation',designationRoute);
app.use('/api/employee',employeeRoute);
app.use('/api/refered_by',refered_byRoute);
app.use('/api/patient_registration',patient_registrationRoute);
// app.use('/api/patient_entity_series',patient_entity_seriesRoute);

//receptionist route
app.use('/api/lead_header',lead_headerRoute);

//Super Admin route 
app.use('/api/wm_customer_header',wm_customer_headerRoute);
app.use('/api/wm_cutomer_type',wm_cutomer_typeRoute);
app.use('/api/wm_modules',wm_modulesRoute);
app.use('/api/super_admin',super_adminRoute);



module.exports = app;