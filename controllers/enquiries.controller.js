import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from 'uuid';
import ExcelJS from 'exceljs';
import sendFCMNotification from "../helpers/NotificationService.js"
import initializeFirebase from '../helpers/firebaseConfig.js';
initializeFirebase();
const prisma = new PrismaClient();

export const createContactEnquiry = async (req, res) => {
  const { name, phoneNumber, email, message: enquiryMessage } = req.body; // Renamed message to enquiryMessage

  // Validate required fields
  if (!name || !phoneNumber || !email || !enquiryMessage) {
    return res.status(400).json({
      success: false,
      message: "Please provide all required fields"
    });
  }

  try {
    // Create new contact enquiry
    const contact = await prisma.enquiries.create({
      data: {
        id: uuidv4(),
        name,
        phoneNumber,
        email,
        message: enquiryMessage
      }
    });

    const fcmToken = 'dg084TSLtBCD38MvYn-y9s:APA91bHMPWfp7mYdjqrS5PrPcLL6GtyBXVHxT-GWdA2ZEDsH2rwab2lnZ5QBthpGcxWAH8hRICwzjA27L0sL-l_8HnWGY3jT3g2wdGML0m2gkao8tqd9AN0'; 
    const title = 'Hello!';
    const notificationMessage = 'This is a notification sdfsfsdfsd .'; // Renamed to notificationMessage
    await sendFCMNotification(fcmToken, title, notificationMessage);

    return res.status(201).json({
      success: true,
      message: "Enquiry submitted successfully",
      data: contact
    });

  } catch (error) {
    console.error("Error saving contact enquiry:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while submitting your enquiry"
    });
  }
};





//admin


export const getAllEnquiries = async (req, res) => {
  try {
    const enquiries = await prisma.enquiries.findMany();
    return res.status(200).json({
      success: true,
      message: "Enquiries fetched successfully",
      enquiries: enquiries
    });
  } catch (error) {
    console.error("Error fetching enquiries:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching enquiries"
    });
  }
}

export const getEnquirybyId = async (req, res) => {
  const { id } = req.params;
  try {
    const enquiry = await prisma.enquiries.findUnique({
      where: { id: id }
    });
    return res.status(200).json({
      success: true,
      message: "Enquiry fetched successfully",
      enquiry: enquiry
    });
  } catch (error) {
    console.error("Error fetching enquiry:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching enquiry"
    });
  }

}


export const updateEnquiry = async (req, res) => {
  const { id } = req.params;
  try {
    const updatedEnquiry = await prisma.enquiries.update({
      where: { id },
      data: { status: 'read' },
    });
    return res.status(200).json({
      success: true,
      message: "Enquiry updated successfully",
      enquiry: updatedEnquiry,
    });
  } catch (error) {
    console.error("Error updating enquiry:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while updating enquiry",
    });
  }
}

export const deleteEnquiry = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedEnquiry = await prisma.enquiries.delete({
      where: { id },
    });
    return res.status(200).json({
      success: true,
      message: "Enquiry deleted successfully",
      enquiry: deletedEnquiry,
    });
  } catch (error) {
    console.error("Error deleting enquiry:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while deleting enquiry",
    });
  }
}

export const exportEnquiries = async (req, res) => {
  try {
    const enquiries = await prisma.enquiries.findMany();

    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Enquiries');

    // Add header row
    worksheet.columns = [
      { header: 'Name', key: 'name', width: 20 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Phone Number', key: 'phoneNumber', width: 15 },
      { header: 'Message', key: 'message', width: 40 },
      { header: 'Created At', key: 'createdAt', width: 20 },
      { header: 'Updated At', key: 'updatedAt', width: 20 },
    ];

    // Add rows
    enquiries.forEach(enquiry => {
      worksheet.addRow({
        name: enquiry.name,
        email: enquiry.email,
        phoneNumber: enquiry.phoneNumber,
        message: enquiry.message,
        createdAt: enquiry.createdAt,
        updatedAt: enquiry.updatedAt,
      });
    });

    // Set response headers and send the Excel file
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename=enquiries.xlsx');

    // Write workbook to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ error: 'Failed to export enquiries' });
  }
}