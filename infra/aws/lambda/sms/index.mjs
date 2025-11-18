export const handler = async (event) => {
  const AWS = await import("aws-sdk");
  const sns = new AWS.SNS({ region: "us-east-1" });

  const body = typeof event.body === "string" ? JSON.parse(event.body) : event;
  const { phoneNumber, message, attributes = {} } = body;

  if (!phoneNumber || !message) {
    throw new Error("Missing phoneNumber or message");
  }

  const messageAttributes = {
    "AWS.SNS.SMS.SMSType": {
      DataType: "String",
      StringValue: attributes.smsType ?? "Transactional",
    },
  };

  if (attributes.senderId) {
    messageAttributes["AWS.SNS.SMS.SenderID"] = {
      DataType: "String",
      StringValue: attributes.senderId,
    };
  }

  const response = await sns
    .publish({
      PhoneNumber: phoneNumber,
      Message: message,
      MessageAttributes: messageAttributes,
    })
    .promise();

  return {
    statusCode: 200,
    body: JSON.stringify({ messageId: response.MessageId }),
  };
};

