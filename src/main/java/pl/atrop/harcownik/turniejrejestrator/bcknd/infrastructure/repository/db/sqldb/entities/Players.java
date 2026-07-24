package pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.repository.db.sqldb.entities;

import jakarta.persistence.Basic;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.NamedQueries;
import jakarta.persistence.NamedQuery;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Size;
import java.io.Serializable;
import java.math.BigDecimal;

/**
 *
 * @author Michał Gnatowski
 * @date 25 wrz 2025
 * @email michal.gnatowski@atrop.pl
 */

@Entity
@Table(name = "players")
@NamedQueries({
    @NamedQuery(name = "Players.findAll", query = "SELECT p FROM Players p"),
    @NamedQuery(name = "Players.findById", query = "SELECT p FROM Players p WHERE p.id = :id"),
    @NamedQuery(name = "Players.findByFirstname", query = "SELECT p FROM Players p WHERE p.firstname = :firstname"),
    @NamedQuery(name = "Players.findByLastname", query = "SELECT p FROM Players p WHERE p.lastname = :lastname"),
    @NamedQuery(name = "Players.findByGender", query = "SELECT p FROM Players p WHERE p.gender = :gender"),
    @NamedQuery(name = "Players.findByCategory", query = "SELECT p FROM Players p WHERE p.category = :category"),
    @NamedQuery(name = "Players.findByGames", query = "SELECT p FROM Players p WHERE p.games = :games"),
    @NamedQuery(name = "Players.findByNightFriSat", query = "SELECT p FROM Players p WHERE p.nightFriSat = :nightFriSat"),
    @NamedQuery(name = "Players.findByNightSatSun", query = "SELECT p FROM Players p WHERE p.nightSatSun = :nightSatSun"),
    @NamedQuery(name = "Players.findBySupperFri", query = "SELECT p FROM Players p WHERE p.supperFri = :supperFri"),
    @NamedQuery(name = "Players.findByDinnerSat", query = "SELECT p FROM Players p WHERE p.dinnerSat = :dinnerSat"),
    @NamedQuery(name = "Players.findBySupperSat", query = "SELECT p FROM Players p WHERE p.supperSat = :supperSat"),
    @NamedQuery(name = "Players.findByDinnerSun", query = "SELECT p FROM Players p WHERE p.dinnerSun = :dinnerSun"),
    @NamedQuery(name = "Players.findByPrice", query = "SELECT p FROM Players p WHERE p.price = :price"),
    @NamedQuery(name = "Players.findByBirthYear", query = "SELECT p FROM Players p WHERE p.birthYear = :birthYear")})
public class Players implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Integer id;
    @Size(max = 256)
    @Column(name = "firstname")
    private String firstname;
    @Size(max = 256)
    @Column(name = "lastname")
    private String lastname;
    @Size(max = 1)
    @Column(name = "gender")
    private String gender;
    @Size(max = 6)
    @Column(name = "category")
    private String category;
    @Column(name = "games")
    private Integer games;
    @Column(name = "night_fri_sat")
    private Boolean nightFriSat;
    @Column(name = "night_sat_sun")
    private Boolean nightSatSun;
    @Column(name = "supper_fri")
    private Boolean supperFri;
    @Column(name = "dinner_sat")
    private Boolean dinnerSat;
    @Column(name = "supper_sat")
    private Boolean supperSat;
    @Column(name = "dinner_sun")
    private Boolean dinnerSun;
    // @Max(value=?)  @Min(value=?)//if you know range of your decimal fields consider using these annotations to enforce field validation
    @Column(name = "price")
    private BigDecimal price;
    @Column(name = "birth_year")
    private Integer birthYear;
    @JoinColumn(name = "registration_id", referencedColumnName = "id")
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    private Registrations registrationId;

    public Players() {
    }

    public Players(Integer id) {
        this.id = id;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getFirstname() {
        return firstname;
    }

    public void setFirstname(String firstname) {
        this.firstname = firstname;
    }

    public String getLastname() {
        return lastname;
    }

    public void setLastname(String lastname) {
        this.lastname = lastname;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Integer getGames() {
        return games;
    }

    public void setGames(Integer games) {
        this.games = games;
    }

    public Boolean getNightFriSat() {
        return nightFriSat;
    }

    public void setNightFriSat(Boolean nightFriSat) {
        this.nightFriSat = nightFriSat;
    }

    public Boolean getNightSatSun() {
        return nightSatSun;
    }

    public void setNightSatSun(Boolean nightSatSun) {
        this.nightSatSun = nightSatSun;
    }

    public Boolean getSupperFri() {
        return supperFri;
    }

    public void setSupperFri(Boolean supperFri) {
        this.supperFri = supperFri;
    }

    public Boolean getDinnerSat() {
        return dinnerSat;
    }

    public void setDinnerSat(Boolean dinnerSat) {
        this.dinnerSat = dinnerSat;
    }

    public Boolean getSupperSat() {
        return supperSat;
    }

    public void setSupperSat(Boolean supperSat) {
        this.supperSat = supperSat;
    }

    public Boolean getDinnerSun() {
        return dinnerSun;
    }

    public void setDinnerSun(Boolean dinnerSun) {
        this.dinnerSun = dinnerSun;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public Integer getBirthYear() {
        return birthYear;
    }

    public void setBirthYear(Integer birthYear) {
        this.birthYear = birthYear;
    }

    public Registrations getRegistrationId() {
        return registrationId;
    }

    public void setRegistrationId(Registrations registrationId) {
        this.registrationId = registrationId;
    }

    @Override
    public int hashCode() {
        int hash = 0;
        hash += (id != null ? id.hashCode() : 0);
        return hash;
    }

    @Override
    public boolean equals(Object object) {
        // TODO: Warning - this method won't work in the case the id fields are not set
        if (!(object instanceof Players)) {
            return false;
        }
        Players other = (Players) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.repository.db.sqldb.entities.Players[ id=" + id + " ]";
    }

}
