package com.uithealthcare.domain.ocr;

public class CccdData {
    private String full_name;
    private String fullName;
    private String gender;
    private String date_of_birth;
    private String dateOfBirth;
    private String address;
    private String country;

    public String getFullName() { return firstNonEmpty(full_name, fullName); }
    public String getGender() { return gender; }
    public String getDateOfBirth() { return firstNonEmpty(date_of_birth, dateOfBirth); }
    public String getAddress() { return address; }
    public String getCountry() { return country; }

    private String firstNonEmpty(String first, String second) {
        if (first != null && !first.trim().isEmpty()) return first;
        return second == null ? "" : second;
    }
}
