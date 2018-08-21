@openapi.openedge.entity.property (name="idProperty", value="id").
DEFINE TEMP-TABLE ttCustomer BEFORE-TABLE bttCustomer
    FIELD id           AS CHARACTER
    FIELD seq          AS INTEGER   INITIAL ?
    FIELD CustNum      AS INTEGER   INITIAL "0" LABEL "Cust Num"
    FIELD Name         AS CHARACTER LABEL "Name"
    FIELD Address      AS CHARACTER LABEL "Address"
    FIELD Address2     AS CHARACTER LABEL "Address2"
    FIELD Balance      AS DECIMAL   INITIAL "0" LABEL "Balance"
    FIELD City         AS CHARACTER LABEL "City"
    FIELD Comments     AS CHARACTER LABEL "Comments"
    FIELD Contact      AS CHARACTER LABEL "Contact"
    FIELD Country      AS CHARACTER INITIAL "USA" LABEL "Country"
    FIELD CreditLimit  AS DECIMAL   INITIAL "1500" LABEL "Credit Limit"
    FIELD Discount     AS INTEGER   INITIAL "0" LABEL "Discount"
    FIELD EmailAddress AS CHARACTER LABEL "Email"
    FIELD Fax          AS CHARACTER LABEL "Fax"
    FIELD Phone        AS CHARACTER LABEL "Phone"
    FIELD PostalCode   AS CHARACTER LABEL "Postal Code"
    FIELD SalesRep     AS CHARACTER LABEL "Sales Rep"
    FIELD State        AS CHARACTER LABEL "State"
    FIELD Terms        AS CHARACTER INITIAL "Net30" LABEL "Terms"
    INDEX seq IS PRIMARY UNIQUE seq
    /* INDEX CustNum IS UNIQUE CustNum */
    .

DEFINE DATASET dsCustomer FOR ttCustomer.